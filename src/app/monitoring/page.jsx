'use client';
import React, { useEffect, useState } from 'react';
import styles from './monitoring.module.css'; // Import the CSS module
import { getLatestEventFromES } from '../../eventStore/services/GetLatestEventFromES'; // Adjust the path as necessary
import { getLatestCalculationDBUpdate } from '../../slices/shared/openCalculationDB'; // Adjust the path as necessary
import Navbar from '../../../components/Navbar';

const MonitoringComponent = () => {
  const [buttonColor, setButtonColor] = useState('gray');
  const [latestDataPushedEvent, setLatestDataPushedEvent] = useState(null);
  const [latestCalculation, setLatestCalculation] = useState(null);
  const [isCalculationFound, setIsCalculationFound] = useState(false);

  // Fetch the latest DataPushed event
  const fetchLatestDataPushedEvent = async () => {
    try {
      const event = await getLatestEventFromES('ChangePushed');
      setLatestDataPushedEvent(event);
    } catch (error) {
      console.error('Error fetching latest DataPushed event:', error);
    }
  };

  // Fetch the latest calculation
  const fetchLatestCalculation = async () => {
    try {
      const calculation = await getLatestCalculationDBUpdate();
      setLatestCalculation(calculation);
    } catch (error) {
      console.error('Error fetching latest calculation:', error);
    }
  };

  useEffect(() => {
    fetchLatestDataPushedEvent();
    fetchLatestCalculation();
  }, []);

  useEffect(() => {
    if (latestDataPushedEvent && latestCalculation) {
      const isMatchingCalculation = latestCalculation.changeId === latestDataPushedEvent.changeId;
      setIsCalculationFound(isMatchingCalculation);
      if (isMatchingCalculation) {
        setButtonColor('green');
      } else {
        setButtonColor('red');
      }
    }
  }, [latestDataPushedEvent, latestCalculation]);

  // Function to render detailed information
  const renderDetails = () => {
    if (latestDataPushedEvent && latestCalculation) {
      return (
        <div className={styles.details}>
          <p><strong>Latest DataPushed Event:</strong> ID: {latestDataPushedEvent.changeId}, Timestamp: {new Date(latestDataPushedEvent.timestamp).toLocaleString()}</p>
          <p><strong>Latest Calculation:</strong> ID: {latestCalculation.changeId}, Timestamp: {new Date(latestCalculation.timestamp).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <Navbar /> {/* Include the Navbar component at the top */}
      <button className={styles.button} style={{ backgroundColor: buttonColor }}>
        Check Calculation Status
      </button>
      {!isCalculationFound && renderDetails()}
    </div>
  );
};

export default MonitoringComponent;
